import Loader from "./Loader";
import PlayButton from "./PlayButton";
import Background from "./Background";
import ReelsContainer from "./ReelsContainer";
import Scoreboard from "./Scoreboard";
import VictoryScreen from "./VictoryScreen";
import { Application } from "pixi.js";
import { sound } from "@pixi/sound";

export default class Game {
    public app: Application;
    private loader: Loader;
    private playBtn: PlayButton;
    private reelsContainer: ReelsContainer;
    private scoreboard: Scoreboard;
    private victoryScreen: VictoryScreen;
    private spinSound: any;
    private isSpinning: boolean = false;
    private winSoundTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this.app = new Application();
        this.initializeSounds();
    }

    private initializeSounds() {
        sound.add('spin', {
            url: 'public/spin.mp3',
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.3;
                }
            }
        });

        sound.add('stop', {
            url: 'public/stop.mp3',
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.4;
                }
            }
        });

        sound.add('coin', {
            url: 'public/coin.mp3',
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.5;
                }
            }
        });

        sound.add('win', {
            url: 'public/win.mp3',
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.6;
                }
            }
        });
    }

    private playSound(soundName: string, options: any = {}) {
        try {
            const currentSound = sound.find(soundName);
            if (currentSound && !currentSound.isPlaying) {
                // Special handling for win sound
                if (soundName === 'win') {
                    // Clear any existing timeout
                    if (this.winSoundTimeout) {
                        clearTimeout(this.winSoundTimeout);
                        this.stopSound('win');
                    }
                    
                    // Play win sound and set timeout to stop it
                    sound.play(soundName, options);
                    this.winSoundTimeout = setTimeout(() => {
                        this.stopSound('win');
                        this.winSoundTimeout = null;
                    }, 3500); // Stop after 3.5 seconds
                } else {
                    // Normal handling for other sounds
                    sound.play(soundName, options);
                }
            }
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }

    private stopSound(soundName: string) {
        try {
            sound.stop(soundName);
        } catch (error) {
            console.warn(`Error stopping sound ${soundName}:`, error);
        }
    }

    public async init() {
        await this.app.init({ width: 960, height: 536 });
        this.loader = new Loader(this.app);
        window.document.body.appendChild(this.app.canvas);
        await this.loader.loadAssets();
        this.createScene();
        this.createPlayButton();
        this.createReels();
        this.createScoreboard();
        this.createVictoryScreen();
    }

    private createScene() {
        const bg = new Background();
        this.app.stage.addChild(bg.sprite);
    }

    private createPlayButton() {
        this.playBtn = new PlayButton(this.app, this.handleStart.bind(this));
        this.app.stage.addChild(this.playBtn.sprite);
    }

    private createReels() {
        this.reelsContainer = new ReelsContainer(this.app);
        this.app.stage.addChild(this.reelsContainer.container);
    }

    private createScoreboard() {
        this.scoreboard = new Scoreboard(this.app);
        this.app.stage.addChild(this.scoreboard.container);
    }

    private createVictoryScreen() {
        this.victoryScreen = new VictoryScreen(this.app);
        this.app.stage.addChild(this.victoryScreen.container);
    }

    handleStart() {
        if (this.isSpinning) return;
        
        // Stop win sound if it's still playing from previous win
        if (this.winSoundTimeout) {
            clearTimeout(this.winSoundTimeout);
            this.stopSound('win');
            this.winSoundTimeout = null;
        }
        
        this.isSpinning = true;
        this.scoreboard.decrement();
        this.playBtn.setDisabled();

        this.playSound('coin');

        setTimeout(() => {
            if (this.isSpinning) {
                this.playSound('spin', {
                    loop: true
                });
            }
        }, 300);

        this.reelsContainer.spin()
            .then((isWin: boolean) => {
                this.isSpinning = false;
                this.stopSound('spin');
                this.playSound('stop');

                setTimeout(() => {
                    this.processSpinResult(isWin);
                }, 200);
            });
    }

    private processSpinResult(isWin: boolean) {
        if (isWin) {
            setTimeout(() => {
                this.playSound('win');
            }, 300);
            
            this.scoreboard.increment();
            this.victoryScreen.show();
        }

        if (!this.scoreboard.outOfMoney) {
            this.playBtn.setEnabled();
        }
    }
}