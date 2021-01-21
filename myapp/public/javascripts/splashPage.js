function sound(src) {
    //Constructor for sound object.
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
      this.sound.play();
    }
    this.stop = function(){
      this.sound.pause();
    }
  }

//Sound for the image animation
const imgSound = new sound("../sounds/wee.m4a");


//When clicking on the window, start the sound.
document.querySelector("img").onmousedown = function() {
    imgSound.play();
}

//When letting go (and therefore stopping the animation), stop the sound.
document.querySelector("img").onmouseup = function() {
    imgSound.stop();
}