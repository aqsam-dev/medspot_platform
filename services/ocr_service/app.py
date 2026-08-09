from fastapi import FastAPI
from pydantic import BaseModel
from ocr_engine import process_prescription
import requests
import uuid
import os

app = FastAPI()


class OCRRequest(BaseModel):
    prescriptionId: str
    imageUrl: str


def download_image(url):

    os.makedirs(
        "temp",
        exist_ok=True
    )

    extension = ".jpg"

    if "." in url:
        possible_ext = url.split(".")[-1]

        if len(possible_ext) <= 5:
            extension = "." + possible_ext

    filename = (
        str(uuid.uuid4()) + extension
    )

    filepath = os.path.join(
        "temp",
        filename
    )

    response = requests.get(url)

    if response.status_code != 200:
        raise Exception(
            "Unable to download image."
        )

    with open(
        filepath,
        "wb"
    ) as file:

        file.write(
            response.content
        )

    return filepath


@app.post("/ocr")
def ocr(data: OCRRequest):

    image_path = None

    try:

        print("\n" + "=" * 60)
        print(
            f"Prescription ID : "
            f"{data.prescriptionId}"
        )

        print(
            f"Image URL : "
            f"{data.imageUrl}"
        )
        print("=" * 60)

        # Download image from Cloudinary
        image_path = download_image(
            data.imageUrl
        )

        print(
            f"[INFO] Downloaded to: "
            f"{image_path}"
        )

        # Run OCR
        result = process_prescription(
            image_path
        )

        return {
            "success": True,
            "prescriptionId":
                data.prescriptionId,

            "medicineCount":
                len(result),

            "results":
                result
        }

    except Exception as e:

        print(
            f"OCR ERROR: {str(e)}"
        )

        return {
            "success": False,
            "message": str(e),
            "results": []
        }

    finally:

        if (
            image_path and
            os.path.exists(image_path)
        ):

            os.remove(
                image_path
            )

            print(
                f"[INFO] Deleted: "
                f"{image_path}"
            )