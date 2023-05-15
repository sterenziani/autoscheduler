import User from '../../abstract/user.model';

export default class MemoryUser extends User {
    // For user there really is nothing much to do, user is just a simple get that is dealt with by the persistence service with a unified method verify that is implemented in abstract class
}
