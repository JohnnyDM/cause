export class CauseClassItem extends Item {

  prepareData() {
    super.prepareData();
    console.log(this.system);
  }

  prepareBaseData() {

  }

  prepateDerivedData() {
      const itemFlag = this;
      const flags = itemData.flags.cause || {};
  }

  getRollData() {
      return { ...super.getRollData(), ...this.system.getRollData?.() ?? null };
  }

  toPlainObject() {
      const result = {...this};
      result.system = this.system.toPlainObject();
      result.items = this.items?.size > 0 ? this.items.contents : [];
      result.effects = this.effects?.size > 0 ? this.effects.contents : [];

      return result;
  }
}