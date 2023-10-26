// Auxiliary interface for building queries
export interface IQueryEntry {
    value?: any;                // Example "pepe" or undefined
    entry: string;              // Example "u.name = $name"
}