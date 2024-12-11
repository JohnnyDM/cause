export class CauseClassActor extends Actor {
    prepareData() {
        super.prepareData();
    }

    prepareBaseData() {

    }

    prepateDerivedData() {
        const actorFlag = this;
        const flags = actorData.flags.cause || {};
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