from PIL import Image
import os

# Directory containing the images
IMAGE_DIR = "./"

# Desired crop size
CROP_WIDTH = 1024
CROP_HEIGHT = 801

def crop_images(directory):
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)

        # Skip non-files
        if not os.path.isfile(filepath):
            continue

        # Try to open as image
        try:
            with Image.open(filepath) as img:
                # Define crop box (left, top, right, bottom)
                crop_box = (0, 0, CROP_WIDTH, CROP_HEIGHT)
                cropped = img.crop(crop_box)

                # Overwrite original
                cropped.save(filepath)
                print(f"Cropped: {filename}")

        except Exception as e:
            print(f"Skipping {filename} (not an image or error): {e}")

if __name__ == "__main__":
    crop_images(IMAGE_DIR)
