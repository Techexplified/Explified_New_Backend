class imageToCartoon{
    constructor({ imageUrl, cartoonImageUrl , userRef }) {
        this.imageUrl = imageUrl;
        this.cartoonImageUrl = cartoonImageUrl;
        this.userRef = userRef; // user reference for easier joins (db.collection("users").doc(userId))
        this.createdAt = new Date();
      }
}
module.exports = {imageToCartoon}; 