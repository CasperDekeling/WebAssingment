function sound(src) {
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

const imgSound = new sound("../sounds/wee.m4a");


document.querySelector("img").onmousedown = function() {
    imgSound.play();
}

document.querySelector("img").onmouseup = function() {
    imgSound.stop();
}