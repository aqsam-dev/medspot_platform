const pool = require("../config/database");
const bcrypt = require("bcryptjs");


exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }

        const result = await pool.query(
            `
        SELECT
          id,
          name,
          username,
          password_hash,
          role,
          is_active

        FROM staff

        WHERE LOWER(username) = LOWER($1)
          AND LOWER(role) = 'admin'

        LIMIT 1
      `,
            [username.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        const admin = result.rows[0];

        if (!admin.is_active) {
            return res.status(403).json({
                success: false,
                message: "Admin account is inactive",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin login successful",

            admin: {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                role: admin.role,
            },
        });
    } catch (err) {
        console.log("ADMIN LOGIN ERROR:", err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


exports.getAdminDashboard = async (req, res) => {

    try {
        const statsResult = await pool.query(`

            SELECT

            (
                SELECT COUNT(*)
                FROM patients
            ) AS total_users,


            (
                SELECT COUNT(*)
                FROM pharmacy
            ) AS total_pharmacies,


            (
                SELECT COUNT(*)
                FROM pharmacy
                WHERE LOWER(verification_status)='pending'
            ) AS pending_pharmacies,


            (
                SELECT COUNT(*)
                FROM pharmacy
                WHERE LOWER(verification_status)='approved'
            ) AS verified_pharmacies,


            (
                SELECT COUNT(*)
                FROM reservations
            ) AS total_reservations,


            (
                SELECT COUNT(*)
                FROM prescriptions
            ) AS total_prescriptions,


            (
                SELECT COUNT(*)
                FROM medicines_catalogue
            ) AS total_medicines

        `);



        const stats = statsResult.rows[0];
        const medicinesResult = await pool.query(`

            SELECT

            medicine_name AS name,

            SUM(quantity) AS units


            FROM reservation_items


            GROUP BY medicine_name


            ORDER BY units DESC


            LIMIT 5

        `);





        const topMedicines =
            medicinesResult.rows.map(item => ({

                name: item.name,

                units: Number(item.units),

                category: "Medicine",

                change: "+"

            }));

        const userGrowthResult = await pool.query(`
  SELECT
    TO_CHAR(days.day, 'DD Mon') AS day,
    COUNT(p.patient_id) AS users

  FROM generate_series(
    CURRENT_DATE - INTERVAL '13 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS days(day)

  LEFT JOIN patients p
    ON DATE(p.created_at) = DATE(days.day)

  GROUP BY days.day

  ORDER BY days.day
`);



        const userGrowth =
            userGrowthResult.rows.map(item => ({

                day: item.day,

                users: Number(item.users)

            }));


        const pharmacyGrowthResult = await pool.query(`
  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE) -
        INTERVAL '5 months',

      DATE_TRUNC('month', CURRENT_DATE),

      INTERVAL '1 month'
    ) AS month_start
  )

  SELECT
    TO_CHAR(month_start, 'Mon') AS month,

    (
      SELECT COUNT(*)
      FROM pharmacy p
      WHERE p.created_at <
        month_start + INTERVAL '1 month'
    ) AS stores

  FROM months

  ORDER BY month_start
`);


        const pharmacyGrowth =
            pharmacyGrowthResult.rows.map(item => ({

                month: item.month,

                stores: Number(item.stores)

            }));

        const activityResult = await pool.query(`


        (
            SELECT

            'Patient Registered'
            AS title,


            name
            AS sub,


            created_at


            FROM patients


            ORDER BY created_at DESC


            LIMIT 5
        )


        UNION ALL


        (
            SELECT

            'Pharmacy Registered'
            AS title,


            pharmacy_name
            AS sub,


            created_at


            FROM pharmacy


            ORDER BY created_at DESC


            LIMIT 5
        )


        UNION ALL


        (
            SELECT

            'Prescription Uploaded'
            AS title,


            prescription_no::text
            AS sub,


            created_at


            FROM prescriptions


            ORDER BY created_at DESC


            LIMIT 5
        )


        ORDER BY created_at DESC


        LIMIT 10


        `);





        const recentActivities =
            activityResult.rows.map(item => ({

                title: item.title,

                sub: item.sub,

                created_at: item.created_at,

                icon:
                    item.title.includes("Patient")
                        ?
                        "person"
                        :
                        item.title.includes("Pharmacy")
                            ?
                            "local_pharmacy"
                            :
                            "description",


                bg: "#e6f4f3",

                color: "#006a61"

            }));


        res.json({

            success: true,


            stats: {


                totalUsers:
                    Number(stats.total_users),


                totalPharmacies:
                    Number(stats.total_pharmacies),


                pendingPharmacies:
                    Number(stats.pending_pharmacies),


                verifiedPharmacies:
                    Number(stats.verified_pharmacies),


                totalReservations:
                    Number(stats.total_reservations),


                totalPrescriptions:
                    Number(stats.total_prescriptions),


                totalMedicines:
                    Number(stats.total_medicines),


                reservationGrowth: 0,

                userGrowth: 0

            },


            topMedicines,


            userGrowth,


            pharmacyGrowth,


            recentActivities


        });



    }
    catch (err) {


        console.log(
            "ADMIN DASHBOARD ERROR:",
            err
        );


        res.status(500).json({

            success: false,

            message: err.message

        });


    }

};




exports.getReservationAnalytics = async (req, res) => {


    try {


        const result = await pool.query(`

SELECT

LOWER(status) AS status,

COUNT(*) AS count


FROM reservations


GROUP BY LOWER(status)


ORDER BY count DESC


`);



        res.json({

            success: true,

            data:
                result.rows.map(item => ({

                    status: item.status,

                    count: Number(item.count)

                }))

        });



    }
    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }


};




exports.getPrescriptionAnalytics = async (req, res) => {


    try {


        const result = await pool.query(`


SELECT

LOWER(status) AS status,

COUNT(*) AS count


FROM prescriptions


GROUP BY LOWER(status)


ORDER BY count DESC


`);



        res.json({

            success: true,


            data:
                result.rows.map(item => ({

                    status: item.status,

                    count: Number(item.count)

                }))


        });



    }
    catch (err) {


        res.status(500).json({

            success: false,

            message: err.message

        });


    }



};