import Loader from "./Loader";
import PlayButton from "./PlayButton";
import Background from "./Background";
import BetButton from "./BetButton";
import ReelsContainer from "./ReelsContainer";
import Scoreboard from "./Scoreboard";
import VictoryScreen from "./VictoryScreen";
import PocketBase from "pocketbase";
import { Application } from "pixi.js";
import { sound } from "@pixi/sound";

export default class Game {
    public app: Application;
    private loader: Loader;
    private playBtn: PlayButton;
    private betButton: BetButton;
    private reelsContainer: ReelsContainer;
    private scoreboard: Scoreboard;
    private victoryScreen: VictoryScreen;
    private isSpinning: boolean = false;
    private winSoundTimeout: NodeJS.Timeout | null = null;
    private pb: PocketBase;

    constructor() {
        this.app = new Application();
        this.pb = new PocketBase("https://byapak1.pockethost.io"); // Replace with your PocketBase URL
        this.initializeSounds();
        this.handleAuthStore();
    }

    private initializeSounds() {
        sound.add("spin", {
            url: "public/spin.mp3",
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.3;
                }
            },
        });

        sound.add("stop", {
            url: "public/stop.mp3",
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.4;
                }
            },
        });

        sound.add("coin", {
            url: "public/coin.mp3",
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.5;
                }
            },
        });

        sound.add("win", {
            url: "public/win.mp3",
            preload: true,
            loaded: (err, sound) => {
                if (sound) {
                    sound.volume = 0.6;
                }
            },
        });
    }

    private async handleAuthStore() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const authToken = urlParams.get("authToken");
            const userData = urlParams.get("userData");

            if (authToken && userData) {
                // Restore the authStore state
                this.pb.authStore.save(authToken, JSON.parse(userData));
                const user = this.pb.authStore.model;

                if (user) {
                    console.log(`Authenticated user: ${user.username}`);
                } else {
                    console.warn("No user found in authStore.");
                }
            } else {
                console.error("Missing authToken or userData in the URL.");
            }
        } catch (error) {
            console.error("Error handling authStore:", error);
        }
    }

    private playSound(soundName: string, options: any = {}) {
        try {
            const currentSound = sound.find(soundName);
            if (currentSound && !currentSound.isPlaying) {
                if (soundName === "win") {
                    if (this.winSoundTimeout) {
                        clearTimeout(this.winSoundTimeout);
                        this.stopSound("win");
                    }
                    sound.play(soundName, options);
                    this.winSoundTimeout = setTimeout(() => {
                        this.stopSound("win");
                        this.winSoundTimeout = null;
                    }, 3500);
                } else {
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

    private createBetButton() {
        this.betButton = new BetButton(this.app, this.handleBetChange.bind(this));
        this.app.stage.addChild(this.betButton.container);
    }

    private handleBetChange(amount: number) {
        const actualBet = this.scoreboard.setBet(amount);
        if (actualBet !== amount) {
            this.betButton.setCurrentBet(actualBet);
        }
    }

    private handleStart() {
        if (this.isSpinning) return;

        const currentBet = this.betButton.getCurrentBet();
        if (this.scoreboard.getMoney() >= currentBet) {
            this.scoreboard.decrement(currentBet);
            this.playBtn.setDisabled();
            this.betButton.setEnabled(false);
            this.isSpinning = true;

            this.playSound("coin");
            setTimeout(() => this.playSound("spin", { loop: true }), 300);

            this.reelsContainer.spin().then((isWin: boolean) => {
                this.isSpinning = false;
                this.stopSound("spin");
                this.playSound("stop");
                this.processSpinResult(isWin);
            });
        } else {
            console.log("Not enough money to place the bet");
        }
    }

    private processSpinResult(isWin: boolean) {
        if (isWin) {
            setTimeout(() => this.playSound("win"), 300);
            this.scoreboard.increment();
            this.victoryScreen.show();
        }

        if (!this.scoreboard.outOfMoney) {
            this.playBtn.setEnabled();
            this.betButton.setEnabled(true);
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
        this.createBetButton();
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
}
