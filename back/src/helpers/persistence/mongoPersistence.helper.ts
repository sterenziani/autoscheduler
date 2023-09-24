import mongoose, { Model, ClientSession, FilterQuery, UpdateQuery, AnyKeys, Document } from 'mongoose';
import GenericException from '../../exceptions/generic.exception';
import { ERRORS } from '../../constants/error.constants';

export const initializeMongoConnection = async (): Promise<void> => {
    // Mongo connection
    mongoose.Promise = global.Promise;
    await mongoose.connect(
        `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`,
        {
            dbName: process.env.MONGO_DB,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        },
    );
    return;
};

export const validateObjectId = (maybeId: string): void => {
    if (!mongoose.Types.ObjectId.isValid(maybeId)) throw new GenericException(ERRORS.BAD_REQUEST.INVALID_OBJECT_ID);
};

export const startTransaction = async (): Promise<ClientSession> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
};

export const endTransaction = async (session: ClientSession | null): Promise<void> => {
    if (session) {
        await session.commitTransaction();
        session.endSession();
    }
};

export const abortTransaction = async (session: ClientSession | null): Promise<void> => {
    if (session) {
        try {
            await session.abortTransaction();
            session.endSession();
        } catch (err) {
            // TODO: Log here, idk what logging system we will use
        }
    }
};

const executeQuery = async (docQuery: any, lean = false, session: ClientSession | null = null) => {
    let query = session ? docQuery.session(session) : docQuery;
    return lean ? await query.lean({ virtuals: true }).exec() : await query.exec();
};

const executePaginatedQuery = async (
    docQuery: any,
    page: number,
    limit: number,
    lean: boolean,
    session: ClientSession | null = null,
) => {
    let query = docQuery.limit(limit).skip((page - 1) * limit);

    return await executeQuery(query, lean, session);
};

export const countDocumentsByQuery = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    limit: number | null = null,
    session: ClientSession | null = null,
): Promise<number> => {
    let docQuery = model.countDocuments(query);

    if (limit) docQuery = docQuery.limit(limit);

    return await executeQuery(docQuery, false, session);
};

export const getDocument = async <T extends Document>(
    model: Model<T>,
    docId: string,
    lean = false,
    session: ClientSession | null = null,
): Promise<T | null> => {
    return await executeQuery(model.findById(docId), lean, session);
};

export const getDocumentByQuery = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    lean = false,
    session: ClientSession | null = null,
): Promise<T | null> => {
    return await executeQuery(model.findOne(query), lean, session);
};

export const getDocumentsByQuery = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    lean = false,
    session: ClientSession | null = null,
): Promise<T[]> => {
    return await executeQuery(model.find(query), lean, session);
};

export const getSortedDocumentByQuery = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    sortBy = 'creationTime',
    descending = true,
    lean = false,
    session: ClientSession | null = null,
): Promise<T | null> => {
    return await executeQuery(model.findOne(query).sort((descending ? '-' : '') + sortBy), lean, session);
};

export const getSortedDocumentsByQuery = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    sortBy = 'creationTime',
    descending = true,
    lean = false,
    session: ClientSession | null = null,
): Promise<T[]> => {
    return await executeQuery(model.find(query).sort((descending ? '-' : '') + sortBy), lean, session);
};

export const getPaginatedDocumentsByQuery = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    page: number,
    limit: number,
    sortBy: string,
    ascending = true,
    session: ClientSession | null = null,
): Promise<T[]> => {
    return await executePaginatedQuery(model.find(query).sort((ascending ? '' : '-') + sortBy), page, limit, true, session);
};

export const updateDocument = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    update: UpdateQuery<T>,
    returnNew = true,
    session: ClientSession | null = null,
): Promise<T | null> => {
    return await executeQuery(model.findOneAndUpdate(query, update, { new: returnNew }), true, session);
};

export const updateDocuments = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    update: UpdateQuery<T>,
    session: ClientSession | null = null,
): Promise<void> => {
    await executeQuery(model.updateMany(query, update), false, session);
};

export const deleteDocuments = async <T extends Document>(
    model: Model<T>,
    query: FilterQuery<T>,
    session: ClientSession | null = null,
): Promise<void> => {
    await executeQuery(model.deleteMany(query), false, session);
};

export const createDocument = async <T extends Document>(
    model: Model<T>,
    doc: AnyKeys<T> | T,
    session: ClientSession | null = null,
): Promise<T> => {
    const res = await createDocuments<T>(model, [doc], session);
    return res[0];
};

export const createDocuments = async <T extends Document>(
    model: Model<T>,
    docs: (AnyKeys<T> | T)[],
    session: ClientSession | null = null,
): Promise<T[]> => {
    return await model.create(docs, { session });
};
