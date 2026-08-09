const axios=require("axios");
const processOCR= async( prescriptionId,imageUrl)=>{

    try{
        const response=
        await axios.post(
            "http://localhost:8000/ocr",
            {
                prescriptionId,
                imageUrl
            }
        );
        return response.data;
    }catch(error){
        console.error(
            "OCR Error:",
            error.message
        );
        return null;
    }
};

module.exports={ processOCR };