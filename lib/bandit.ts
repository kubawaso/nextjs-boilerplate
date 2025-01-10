interface ArmData {
  title: string;
  alpha: number;
  beta: number;
}

export default class BanditManager {
  arms: ArmData[];

  constructor(armsData: ArmData[]) {
    this.arms = armsData;
  }

  selectArm(): number {
    let chosenIndex = 0;
    let maxSample = -1;
    this.arms.forEach((arm, i) => {
      const sample = this._betaRandom(arm.alpha, arm.beta);
      if (sample > maxSample) {
        maxSample = sample;
        chosenIndex = i;
      }
    });
    return chosenIndex;
  }

  updateArm(index: number, reward: number): void {
    // reward = 1 if clicked, 0 if not, aggregated over interval
    this.arms[index].alpha += reward;
    this.arms[index].beta += (1 - reward);
  }

  private _betaRandom(alpha: number, beta: number): number {
    // naive Beta sampling
    const u1 = Math.random() ** (1 / alpha);
    const u2 = Math.random() ** (1 / beta);
    return u1 / (u1 + u2);
  }
} 