import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";

export default class BetButton {
    public readonly container: Container;
    private readonly onBetChange: (amount: number) => void;
    private currentBet: number;
    private readonly minBet: number = 5;
    private readonly maxBet: number = 60;
    private betText: Text;
    private increaseBtnSprite: Sprite;
    private decreaseBtnSprite: Sprite;
    private maxBetBtn: Sprite;
    private minBetBtn: Sprite;
    
    private app: Application;
    constructor(app: Application, onBetChange: (amount: number) => void, initialBet: number = 5) {
        this.app = app;
        this.container = new Container();
        this.onBetChange = onBetChange;
        this.currentBet = initialBet;
        this.init(app.screen.width, app.screen.height);
    }

    private init(appWidth: number, appHeight: number) {
        // Create background panel
        const panel = new Graphics()
            .beginFill(0x02474E, 0.8)
            .drawRect(0, 0, 200, 150)
            .endFill();

        // Create bet display
        const style = new TextStyle({
            fontFamily: "Arial",
            fontSize: 24,
            fill: "yellow",
            stroke: '#000000',
             
        });

        this.betText = new Text({ 
            text: `Bet: $${this.currentBet}`, 
            style 
        });
        this.betText.x = 60;
        this.betText.y = 20;

        // Create bet control buttons
        this.createButtons();

        // Position the container
        this.container.x = appWidth - panel.width - 250; // Position to the left of scoreboard
        this.container.y = appHeight / 2 + 70;

        // Add all elements to container
        this.container.addChild(
            panel,
            this.betText,
            this.increaseBtnSprite,
            this.decreaseBtnSprite,
            this.maxBetBtn,
            this.minBetBtn
        );
    }

    private createButtons() {
        // Create increase/decrease buttons using existing assets or create new ones
        this.increaseBtnSprite = this.createButton("+", 130, 15);
        this.decreaseBtnSprite = this.createButton("-", 20, 15);
        this.maxBetBtn = this.createButton("Max", 130, 60);
        this.minBetBtn = this.createButton("Min", 20, 60);

        // Add event listeners
        this.setupButtonInteraction(this.increaseBtnSprite, () => this.adjustBet(5));
        this.setupButtonInteraction(this.decreaseBtnSprite, () => this.adjustBet(-5));
        this.setupButtonInteraction(this.maxBetBtn, () => this.setMaxBet());
        this.setupButtonInteraction(this.minBetBtn, () => this.setMinBet());
    }

    private createButton(label: string, x: number, y: number): Sprite {
        const button = new Graphics()
            .beginFill(0x4a4a4a)
            .drawRoundedRect(0, 0, 80, 40, 10)//manage button size

        const buttonTexture = this.app.renderer.generateTexture(button);
        const buttonSprite = new Sprite(buttonTexture);
        
        buttonSprite.x = x;
        buttonSprite.y = y;
        
        const text = new Text( label,{
             
                fontFamily: "Arial",
                fontSize: 20,
                fill: "white"
    })
        
        
        text.x = (buttonSprite.width - text.width) / 2;
        text.y = (buttonSprite.height - text.height) / 2;
        
        buttonSprite.addChild(text);
         // Hover effect to change button color
         buttonSprite.on('pointerover', () => {
            button.beginFill(0x666666);  // Darker shade on hover
            button.drawRoundedRect(0, 0, 80, 40, 10);
            button.endFill();
        });

        buttonSprite.on('pointerout', () => {
            button.beginFill(0x4a4a4a);  // Original color when not hovered
            button.drawRoundedRect(0, 0, 80, 40, 10);
            button.endFill();
        });
        return buttonSprite;
    }

    private setupButtonInteraction(button: Sprite, callback: () => void) {
        button.interactive = true;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.on('pointerdown', callback);
    }

    private adjustBet(amount: number) {
        const newBet = Math.max(this.minBet, Math.min(this.maxBet, this.currentBet + amount));
        if (newBet !== this.currentBet) {
            this.currentBet = newBet;
            this.updateDisplay();
            this.onBetChange(this.currentBet);
        }
    }

    private setMaxBet() {
        this.currentBet = this.maxBet;
        this.updateDisplay();
        this.onBetChange(this.currentBet);
    }

    private setMinBet() {
        this.currentBet = this.minBet;
        this.updateDisplay();
        this.onBetChange(this.currentBet);
    }

    private updateDisplay() {
        this.betText.text = `Bet: $${this.currentBet}`;
    }

    public getCurrentBet(): number {
        return this.currentBet;
    }

    // Method to programmatically set the current bet
    public setCurrentBet(newBet: number) {
        const clampedBet = Math.max(this.minBet, Math.min(this.maxBet, newBet));
        if (clampedBet !== this.currentBet) {
            this.currentBet = clampedBet;
            this.updateDisplay();
            this.onBetChange(this.currentBet);
        }
    }

    public setEnabled(enabled: boolean) {
        this.container.interactive = enabled;
        this.increaseBtnSprite.interactive = enabled;
        this.decreaseBtnSprite.interactive = enabled;
        this.maxBetBtn.interactive = enabled;
        this.minBetBtn.interactive = enabled;
        this.container.alpha = enabled ? 1 : 0.5;
    }
}