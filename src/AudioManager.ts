import { Howl, Howler } from "howler";

const sounds = {
  jump: new Howl({
    src: ["https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"],
    volume: 0.5,
  }),
  duck: new Howl({
    src: ["https://actions.google.com/sounds/v1/cartoon/slide_whistle.ogg"],
    volume: 0.5,
  }),
  hit: new Howl({
    src: ["https://actions.google.com/sounds/v1/cartoon/slip.ogg"],
    volume: 0.8,
  }),
  energy: new Howl({
    src: ["https://actions.google.com/sounds/v1/cartoon/siren_whistle.ogg"],
    volume: 0.5,
  }),
  ring: new Howl({
    src: ["https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"],
    volume: 1.0,
  }),
  fever: new Howl({
    src: ["https://actions.google.com/sounds/v1/science_fiction/laser_pew.ogg"],
    volume: 1.0,
    loop: true,
  }),
  bgm: new Howl({
    src: [
      "https://actions.google.com/sounds/v1/science_fiction/arcade_game_music.ogg",
    ],
    volume: 0.3,
    loop: true,
  }),
  feverBgm: new Howl({
    src: [
      "https://actions.google.com/sounds/v1/science_fiction/cyber_city_ambience.ogg",
    ],
    volume: 0.7,
    loop: true,
  }),
};

export const playSound = (name: keyof typeof sounds) => {
  sounds[name].play();
};

export const stopSound = (name: keyof typeof sounds) => {
  sounds[name].stop();
};

export const setMute = (muted: boolean) => {
  Howler.mute(muted);
};

export const setGlobalVolume = (volume: number) => {
  Howler.volume(volume);
};
