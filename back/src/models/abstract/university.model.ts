import GenericModel from './generic.model';

export default abstract class University extends GenericModel {
    // Properties
    name: string;
    verified: boolean;

    // Abstract class constructor.
    constructor(id: string, name: string, verified: boolean) {
        super(id);
        this.name = name;
        this.verified = verified;
    }

    // Methods
}
