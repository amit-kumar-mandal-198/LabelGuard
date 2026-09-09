from pathlib import Path

import cv2
import numpy as np


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def load_image(image_path: str | Path) -> np.ndarray:
    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported image type: {path.suffix}")

    image = cv2.imread(str(path))

    if image is None:
        raise ValueError(f"Unable to decode image: {path}")

    return image


def rotate_image(image: np.ndarray, angle: int) -> np.ndarray:
    if angle == 0:
        return image

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)

    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

    raise ValueError("Angle must be one of 0, 90, 180, 270.")


def resize_for_ocr(
    image: np.ndarray,
    target_width: int = 1800,
) -> np.ndarray:
    height, width = image.shape[:2]

    if width >= target_width:
        return image

    scale = target_width / width
    new_width = int(width * scale)
    new_height = int(height * scale)

    return cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_CUBIC,
    )


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8),
    )

    return clahe.apply(gray)


def denoise(image: np.ndarray) -> np.ndarray:
    return cv2.fastNlMeansDenoising(
        image,
        None,
        h=10,
        templateWindowSize=7,
        searchWindowSize=21,
    )


def sharpen(image: np.ndarray) -> np.ndarray:
    kernel = np.array(
        [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ],
        dtype=np.float32,
    )

    return cv2.filter2D(image, -1, kernel)


def adaptive_threshold(image: np.ndarray) -> np.ndarray:
    return cv2.adaptiveThreshold(
        image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )


def preprocess_for_ocr(image: np.ndarray) -> dict[str, np.ndarray]:
    resized = resize_for_ocr(image)
    enhanced = enhance_contrast(resized)
    denoised = denoise(enhanced)
    sharpened = sharpen(denoised)
    thresholded = adaptive_threshold(sharpened)

    return {
        "original": resized,
        "gray": enhanced,
        "denoised": denoised,
        "sharpened": sharpened,
        "thresholded": thresholded,
    }


def save_processed_images(
    results: dict[str, np.ndarray],
    output_dir: str | Path,
    stem: str,
) -> dict[str, str]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    saved_files: dict[str, str] = {}

    for name, image in results.items():
        file_path = output_path / f"{stem}_{name}.png"
        cv2.imwrite(str(file_path), image)
        saved_files[name] = str(file_path)

    return saved_files
