/**
 * Resize image
 * 
 * @param file image source file
 * @param mimeType image mime type
 * @param maxWidth max width
 * @param maxHeight max height
 * @param keepAspectRatio whether to preserve aspect ration
 * @returns 
 */
export function resizeImage(file: File, maxWidth: number, maxHeight: number, keepAspectRatio: boolean = false): Promise<string> {
    const url = URL.createObjectURL(file);
    const mimeType = file.type;

    return new Promise((resolve, reject) => {
        let image = new Image();
        image.src = url;
        image.onload = () => {
            let width = image.width;
            let height = image.height;

            // If image is small enough, no need to resize
            if (width <= maxWidth && height <= maxHeight) {
                resolve(url);
                return;
            }

            // Compute new width / height
            let newWidth = maxWidth;
            let newHeight = maxHeight;

            if (keepAspectRatio) {
                if (width > height) {
                    newHeight = height * (maxWidth / width);
                    newWidth = maxWidth;
                } else {
                    newWidth = width * (maxHeight / height);
                    newHeight = maxHeight;
                }
            }

            // Draw image to canvas
            let canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;

            let context = canvas.getContext('2d') as CanvasRenderingContext2D;
            context.drawImage(image, 0, 0, newWidth, newHeight);

            // Convert image to blob
            canvas.toBlob((blob) => {
                if (null != blob) {
                    // Revoke original image's data url
                    URL.revokeObjectURL(url);

                    // Create resized image data url from blob
                    resolve(URL.createObjectURL(blob));
                }
            }, mimeType);
        };
        image.onerror = reject;
    });
}