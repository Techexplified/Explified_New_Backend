class ImageCartoonizer {
  constructor({ image, cartoonImage }) {
    this.image = image;
    this.cartoonImage = cartoonImage;
    this.createdAt = new Date();
  }
}

module.exports = ImageCartoonizer;
