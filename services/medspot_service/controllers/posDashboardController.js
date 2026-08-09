const pool = require("../config/database");

async function getStatus(req,res){

    const { pharmacyId } = req.params;

    try{

        const { rows } = await pool.query(

            `
            SELECT

                p.pos_name,
                p.base_url,
                p.api_key,
                p.is_active,

                MAX(h.sync_time) AS last_sync,

                COUNT(c.cache_id) AS total_medicines

            FROM pharmacy_pos_integration p

            LEFT JOIN inventory_cache c

            ON p.pharmacy_id=c.pharmacy_id

            LEFT JOIN sync_history h

            ON p.pharmacy_id=h.pharmacy_id

            WHERE p.pharmacy_id=$1

            GROUP BY
                p.pos_name,
                p.base_url,
                p.api_key,
                p.is_active
            `,

            [pharmacyId]

        );

        if(!rows.length){

            return res.json({

                connected:false,
                vendor:"",
                last_sync:"Never",
                total_medicines:0

            });

        }

        const data=rows[0];

        res.json({

            connected:data.is_active,

            vendor:data.pos_name,

            base_url:data.base_url,

            api_key:data.api_key,

            last_sync:data.last_sync,

            total_medicines:Number(data.total_medicines)

        });

    }

    catch(err){

        res.status(500).json({
            error:err.message
        });

    }

}

async function getHistory(req, res) {
    const { pharmacyId } = req.params;

    try {
        const { rows } = await pool.query(
            `
            SELECT
                sync_id AS id,
                sync_time,
                status,
                records_synced,
                message
            FROM sync_history
            WHERE pharmacy_id = $1
            ORDER BY sync_time DESC
            `,
            [pharmacyId]
        );

        res.json(rows);
    } catch (err) {
        console.error("getHistory:", err);
        res.status(500).json({
            error: err.message
        });
    }
}

module.exports={
    getStatus,
    getHistory
};