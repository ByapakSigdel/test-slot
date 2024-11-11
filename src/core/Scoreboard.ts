import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";

export default class Scoreboard {
    public container: Container;
    public outOfMoney = false;
    private winAmountText: Text;
    private moneyText: Text;
    private streakText: Text;
    private winAmount: number = 0;
    private money: number = 100;
    private bet: number = 5;
    private currentStreak: number = 0;
    private maxStreak: number = 0;
    private readonly winMultipliers: Record<string, number>;
    private readonly minimumBet: number = 1;
    private readonly maximumBet: number = 100;

    constructor(app: Application) {
        this.container = new Container();

        // Initialize win multipliers
        this.winMultipliers = {
            small_win: 2,    // 2x bet
            medium_win: 5,   // 5x bet
            big_win: 10,     // 10x bet
            mega_win: 20     // 20x bet (rare special case)
        };

        // Initialize UI elements
        this.winAmountText = new Text('', this.getTextStyle());
        this.moneyText = new Text('', this.getTextStyle());
        this.streakText = new Text('', this.getTextStyle());

        this.generate(app.screen.width, app.screen.height);
        this.updateDisplay();
    }

    private getTextStyle(): TextStyle {
        return new TextStyle({
            fontFamily: "Arial",
            fontSize: 24,
            fill: "yellow",
            stroke: '#000000',
            //strokeThickness: 2
        });
    }

    // Decrease money by bet amount
    public decrement(betAmount: number) {
        if (!this.outOfMoney && this.money >= betAmount) {
            this.money -= betAmount;
            this.currentStreak = 0;
            if (this.money < this.minimumBet) {
                this.outOfMoney = true;
            }
            this.updateDisplay();
        }
    }

    // Increase money based on win
    public increment(winType: string = 'small_win') {
        const multiplier = this.winMultipliers[winType] || this.winMultipliers.small_win;
        const winAmount = this.bet * multiplier;

        this.money += winAmount;
        this.winAmount += winAmount;
        this.currentStreak++;
        this.maxStreak = Math.max(this.maxStreak, this.currentStreak);

        // Bonus for streak
        if (this.currentStreak > 3) {
            const bonusMultiplier = Math.min(Math.floor(this.currentStreak / 3), 3);
            const bonus = Math.floor(winAmount * 0.1 * bonusMultiplier);
            this.money += bonus;
            this.winAmount += bonus;
        }

        this.updateDisplay();

        // Check if the player is no longer out of money
        if (this.outOfMoney && this.money >= this.minimumBet) {
            this.outOfMoney = false;
        }
    }

    // Set the bet amount and return the new bet value
    public setBet(amount: number): number {
        const newBet = Math.max(
            this.minimumBet,
            Math.min(
                this.maximumBet,
                Math.min(amount, this.money)
            )
        );
        this.bet = newBet;
        this.updateDisplay();
        return this.bet;
    }

    public getMoney(): number {
        return this.money;
    }

    public getBet(): number {
        return this.bet;
    }

    public getStreak(): number {
        return this.currentStreak;
    }

    // Update the displayed UI
    private updateDisplay() {
        this.moneyText.text = `Money: $${this.money}`;
        this.winAmountText.text = `Total Wins: $${this.winAmount}`;
        this.streakText.text = `Streak: ${this.currentStreak} (Best: ${this.maxStreak})`;
    }

    private generate(appWidth: number, appHeight: number) {
        // Create background panel
        const padding = 15;
        const rectHeight = 120; // Adjusted height
        const rect = new Graphics()
            .beginFill(0x02474E, 0.8)
            .drawRect(0, 0, 200, rectHeight)
            .endFill();

        // Position text elements
        this.moneyText.y = padding;
        this.winAmountText.y = this.moneyText.y + this.moneyText.height + padding;
        this.streakText.y = this.winAmountText.y + this.winAmountText.height + padding;

        // Align text
        [this.moneyText, this.winAmountText, this.streakText].forEach(text => {
            text.x = padding;
        });

        // Position container
        this.container.x = appWidth - rect.width - padding;
        this.container.y = appHeight / 2 + 70;

        // Add all elements to container
        this.container.addChild(
            rect,
            this.moneyText,
            this.winAmountText,
            this.streakText
        );
    }
}
