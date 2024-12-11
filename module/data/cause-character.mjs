import CauseClassActorBase from "./cause-actor.mjs";

export default class CauseClassCharacter extends CauseClassActorBase {
    static defineShema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        return schema;
    }
}