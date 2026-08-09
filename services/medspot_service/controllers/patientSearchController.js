const pool = require("../config/database");
const { syncPharmacyInventory } = require("../services/posService");

async function refreshStaleNearbyInventories(
  latitude,
  longitude
) {
  const result = await pool.query(
    `
    SELECT
      p.pharmacy_id,
      MAX(ic.last_synced) AS last_synced
    FROM pharmacy p
    JOIN pharmacy_pos_integration pos
      ON pos.pharmacy_id = p.pharmacy_id
      AND pos.is_active = TRUE
    LEFT JOIN inventory_cache ic
      ON ic.pharmacy_id = p.pharmacy_id
    WHERE
      LOWER(p.verification_status) = 'approved'
      AND COALESCE(p.is_blocked, FALSE) = FALSE
      AND p.map_lat IS NOT NULL
      AND p.map_lng IS NOT NULL
      AND (
        6371 *
        ACOS(
          LEAST(
            1,
            GREATEST(
              -1,
              COS(RADIANS($1))
              * COS(RADIANS(p.map_lat))
              * COS(
                  RADIANS(p.map_lng)
                  - RADIANS($2)
                )
              + SIN(RADIANS($1))
              * SIN(RADIANS(p.map_lat))
            )
          )
        )
      ) <= 5

    GROUP BY p.pharmacy_id

    HAVING
      MAX(ic.last_synced) IS NULL
      OR MAX(ic.last_synced)
         < NOW() - INTERVAL '5 minutes'
    `,
    [latitude, longitude]
  );

  const pharmacyIds = result.rows.map(
    (row) => row.pharmacy_id
  );

  if (pharmacyIds.length === 0) {
    return;
  }

  const syncResults = await Promise.allSettled(
    pharmacyIds.map((pharmacyId) =>
      syncPharmacyInventory(pharmacyId)
    )
  );

  syncResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.log(
        `Automatic POS sync failed for pharmacy ${pharmacyIds[index]}:`,
        result.reason?.message
      );
    }
  });
}



exports.searchMedicines = async (req, res) => {

  try {

    const keyword = req.query.keyword?.trim();

    if (!keyword) {
      return res.json([]);
    }

    const { rows } = await pool.query(
      `
                    SELECT
    id,
    name,
    generic_name,
    brand,
    strength,
    form
FROM medicines_catalogue
WHERE
    name ILIKE $1
    OR COALESCE(generic_name,'') ILIKE $1
    OR COALESCE(brand,'') ILIKE $1
ORDER BY name
LIMIT 10
`,
      [
        `${keyword}%`
      ]
    );

    res.json(rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Failed to search medicines."
    });

  }

};

exports.searchPharmacies = async (req, res) => {
  try {
    const {
      medicines,
      latitude,
      longitude,
    } = req.body;

    if (
      !Array.isArray(medicines) ||
      medicines.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Medicine list required.",
      });
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      !Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid latitude and longitude are required.",
      });
    }

    const keywords = medicines
      .map((medicine) =>
        medicine?.name?.trim()
      )
      .filter(Boolean)
      .map((name) => `%${name}%`);

    if (keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one valid medicine name is required.",
      });
    }

    await refreshStaleNearbyInventories(
      parsedLatitude,
      parsedLongitude
    );

    const totalRequested = keywords.length;
    const sql = `
  SELECT
      p.pharmacy_id,
      p.pharmacy_name,
      p.city,
      p.area,
      p.shop_no,
      p.street_no,
      p.block_no,
      p.map_lat,
      p.map_lng,
      p.operating_hours,

      COALESCE(
          (
              SELECT ROUND(
                  AVG(r.rating)::numeric,
                  1
              )::double precision
              FROM reviews r
              WHERE r.pharmacy_id = p.pharmacy_id
          ),
          0
      ) AS rating,

      COALESCE(
          (
              SELECT COUNT(*)::integer
              FROM reviews r
              WHERE r.pharmacy_id = p.pharmacy_id
          ),
          0
      ) AS reviews_count,

      COUNT(DISTINCT ic.brand_name) AS matched_count,
      MAX(ic.last_synced) AS last_updated,

      json_agg(
          DISTINCT jsonb_build_object(
              'external_medicine_id', ic.external_medicine_id,
              'brand_name', ic.brand_name,
              'generic_name', ic.generic_name,
              'strength', ic.strength,
              'form', ic.form,
              'price', ic.selling_price,
              'quantity', ic.stock_quantity,

              'exact_match',
              (
                  ic.brand_name ILIKE ANY($3)
              ),

              'alternatives',
              (
                  SELECT COALESCE(
                      json_agg(
                          json_build_object(
                              'brand_name', alt.brand_name,
                              'price', alt.selling_price,
                              'quantity', alt.stock_quantity
                          )
                      ),
                      '[]'
                  )
                  FROM inventory_cache alt
                  WHERE
                      alt.pharmacy_id = ic.pharmacy_id
                      AND alt.generic_name = ic.generic_name
                      AND alt.brand_name <> ic.brand_name
                      AND alt.stock_quantity > 0
              )
          )
      ) AS medicines,

      (
          6371 *
          acos(
              cos(radians($1))
              *
              cos(radians(p.map_lat))
              *
              cos(
                  radians(p.map_lng)
                  -
                  radians($2)
              )
              +
              sin(radians($1))
              *
              sin(radians(p.map_lat))
          )
      ) AS distance

  FROM pharmacy p

  JOIN inventory_cache ic
  ON ic.pharmacy_id = p.pharmacy_id

  WHERE
  (
      ic.brand_name ILIKE ANY($3)
      OR
      COALESCE(ic.generic_name, '') ILIKE ANY($3)
  )
  AND ic.stock_quantity > 0

  GROUP BY p.pharmacy_id

  HAVING
  (
      6371 *
      acos(
          cos(radians($1))
          *
          cos(radians(p.map_lat))
          *
          cos(
              radians(p.map_lng)
              -
              radians($2)
          )
          +
          sin(radians($1))
          *
          sin(radians(p.map_lat))
      )
  ) <= 5

  ORDER BY distance ASC;
`;

    const { rows } = await pool.query(sql, [
      parsedLatitude,
      parsedLongitude,
      keywords,
    ]);

    const today = new Date()
      .toLocaleDateString("en-US", {
        weekday: "long",
      })
      .toLowerCase();

    const currentTime = new Date()
      .toTimeString()
      .slice(0, 5);

    const daysOrder = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    rows.forEach((pharmacy) => {
      // Availability %
      pharmacy.availability_percentage = Math.round(
        (Number(pharmacy.matched_count) / totalRequested) * 100
      );

      const schedule = pharmacy.operating_hours?.[today];

      pharmacy.is_open = false;
      pharmacy.today_hours = "Closed";

      pharmacy.opening_hours = daysOrder.map((day) => {
        const value = pharmacy.operating_hours?.[day];

        return {
          day: day.charAt(0).toUpperCase() + day.slice(1),
          time: value?.isOpen
            ? `${value.open} - ${value.close}`
            : "Closed",
          is_today: day === today,
        };
      });

      if (!schedule) return;

      if (!schedule.isOpen) return;

      pharmacy.today_hours = `${schedule.open} - ${schedule.close}`;

      if (
        schedule.open === "00:00" &&
        schedule.close === "23:59"
      ) {
        pharmacy.is_open = true;
      } else if (
        schedule.open &&
        schedule.close
      ) {
        pharmacy.is_open =
          currentTime >= schedule.open &&
          currentTime <= schedule.close;
      }
      // Remove duplicate alternatives and build a pharmacy-level list
      const pharmacyAlternatives = [];
      const pharmacySeen = new Set();

      pharmacy.medicines.forEach((medicine) => {
        const unique = [];
        const seen = new Set();

        medicine.alternatives.forEach((alt) => {
          // Remove duplicates within this medicine
          if (!seen.has(alt.brand_name)) {
            seen.add(alt.brand_name);
            unique.push(alt);
          }

          // Build one pharmacy-level alternatives list
          if (!pharmacySeen.has(alt.brand_name)) {
            pharmacySeen.add(alt.brand_name);

            pharmacyAlternatives.push({
              brand_name: alt.brand_name,
              price: alt.price,
              quantity: alt.quantity,
            });
          }
        });

        medicine.alternatives = unique;
      });

      // Add this field to the pharmacy object
      pharmacy.alternative_medicines = pharmacyAlternatives;

    });

    return res.json({
      success: true,
      total_requested: totalRequested,
      data: rows,
    });
  } catch (err) {
    console.error("Search Error:", err);

    return res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
};

exports.nearbyPharmacies = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const sql = `
      SELECT *
FROM (
  SELECT
    p.pharmacy_id,
    p.pharmacy_name,
    p.city,
    p.area,
    p.shop_no,
    p.street_no,
    p.block_no,
    p.map_lat,
    p.map_lng,
    p.operating_hours,

    (
      6371 *
      acos(
        cos(radians($1))
        *
        cos(radians(p.map_lat))
        *
        cos(
          radians(p.map_lng)
          - radians($2)
        )
        +
        sin(radians($1))
        *
        sin(radians(p.map_lat))
      )
    ) AS distance

  FROM pharmacy p
) nearby

WHERE distance <= 5

ORDER BY distance ASC
LIMIT 3;
    `;

    const { rows } = await pool.query(sql, [
      latitude,
      longitude,
    ]);

    const today = new Date()
      .toLocaleDateString("en-US", {
        weekday: "long",
      })
      .toLowerCase();

    const currentTime = new Date()
      .toTimeString()
      .slice(0, 5);

    rows.forEach((pharmacy) => {
      const schedule =
        pharmacy.operating_hours?.[today];

      pharmacy.is_open = false;
      pharmacy.today_hours = "Closed";

      if (!schedule) return;

      if (!schedule.isOpen) return;

      pharmacy.today_hours =
        `${schedule.open} - ${schedule.close}`;

      if (
        schedule.open === "00:00" &&
        schedule.close === "23:59"
      ) {
        pharmacy.is_open = true;
      } else {
        pharmacy.is_open =
          currentTime >= schedule.open &&
          currentTime <= schedule.close;
      }
    });

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Nearby Pharmacy Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby pharmacies",
    });
  }
};
