export const playTypingSound = () => {
  const audio = new Audio("/typing.mp3");
  audio.volume = 0.8;
  audio.play();
};

export const playCommandSound = () => {
  const audio = new Audio("/command.mp3");
  audio.volume = 0.3;
  audio.play();
};
