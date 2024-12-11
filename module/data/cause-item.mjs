export default class CauseClassItemBase extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = {};
    
        schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields


        // Weapon Data
        schema.attribute = new fields.StringField({ required: true, blank: false, options: ["Vigor", "Grace", "Instinct", "Thought"], initial: "Vigor" });
        schema.damage = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 10});
        schema.bonus = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 5});
        schema.reach = new fields.StringField({ required: true, blank: false, options: ["Arm's Reach", "Short", "Mid", "Far", "Drop-Off"], initial: "Arm's Reach" });
        schema.reload = new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 0 })
        });

        // Skill Data
        schema.skillcost = new fields.SchemaField({
            type: new fields.StringField({ required: true, blank: false, options: ["Positive", "Negative"], initial: "Positive" }),
            cost: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 5})
        });        
        schema.skilltype = new fields.StringField({ required: true, blank: false, options: ["Attack", "Defense", "Interact", "Utility"], initial: "Attack" })
        schema.skillattribute = new fields.SchemaField({
            use: new fields.BooleanField({}),
            type: new fields.StringField({ required: true, blank: false, options: ["Vigor", "Grace", "Instinct", "Thought"], initial: "Vigor" })
        });          

        return schema;
      }
}