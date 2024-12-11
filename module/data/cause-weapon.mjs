import CauseClassItemBase from "./cause-item.mjs";

export default class CauseClassWeapon extends CauseClassItemBase {
    static defineShema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();



        return schema;
    }
}