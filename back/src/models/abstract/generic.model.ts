export default abstract class GenericModel {
    // All models have id in common
    id: string; // Id of the entity in our databases. Optional since you can create a Model without id which means it's not in our databases (Mainly just for entity creation)

    protected constructor(id: string) {
        this.id = id;
    }
}
