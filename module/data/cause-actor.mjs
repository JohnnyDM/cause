export default class CauseClassActorBase extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = {};
    
        schema.vigor = new fields.SchemaField({
          value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
          ability: new fields.NumberField({ ...requiredInteger, initial: 5 }),
          max: new fields.NumberField({ ...requiredInteger, initial: 10 })
        });
        schema.grace = new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            ability: new fields.NumberField({ ...requiredInteger, initial: 5 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 10 })
        });
        schema.instinct = new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            ability: new fields.NumberField({ ...requiredInteger, initial: 5 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 10 })
        });
        schema.thought = new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
            ability: new fields.NumberField({ ...requiredInteger, initial: 5 }),
            max: new fields.NumberField({ ...requiredInteger, initial: 10 })
        });
        schema.biography = new fields.StringField({ required: true, blank: true }); // equivalent to passing ({initial: ""}) for StringFields
    
        schema.pendulum = new fields.SchemaField({
            value: new fields.NumberField({ ...requiredInteger, initial: 0, min: -5, max: 5 })
        });

        return schema;
      }
}