export default class CauseItemSheet extends ItemSheet {
    get template() {
        return `systems/cause/templates/item/item-${this.item.type}.hbs`;
    }
}