import { MEMORY_DATABASE } from "../../../constants/persistence/memoryPersistence.constants";
import TimeRange from "../../../helpers/classes/timeRange.class";
import { addChildToParent } from "../../../helpers/persistence/memoryPersistence.helper";
import Lecture from "../../../models/abstract/lecture.model";
import MemoryLecture from "../../../models/implementations/memory/memoryLecture.model";
import LectureDao from "../../abstract/lecture.dao";
import MemoryBuildingDao from "./memoryBuilding.dao";
import MemoryCourseClassDao from "./memoryCourseClass.dao";
import {v4 as uuidv4} from "uuid";

export default class MemoryLectureDao extends LectureDao {
    private static instance: LectureDao;

    static getInstance = () => {
        if (!MemoryLectureDao.instance) {
            MemoryLectureDao.instance = new MemoryLectureDao();
        }
        return MemoryLectureDao.instance;
    }

    // Abstract Methods Implementations
    public async create(courseClassId: string, buildingId: string, time: TimeRange): Promise<Lecture> {
        // We get the course class and the building to check that they exist
        const courseClass = await MemoryCourseClassDao.getInstance().getById(courseClassId);
        const building = await MemoryBuildingDao.getInstance().getById(buildingId);
        const newLecture = new MemoryLecture(uuidv4(), time);

        MEMORY_DATABASE.lectures.set(newLecture.id, newLecture);
        addChildToParent(MEMORY_DATABASE.lecturesOfCourseClass, courseClass.id, newLecture.id);
        addChildToParent(MEMORY_DATABASE.lecturesOfBuilding, building.id, newLecture.id);

        return newLecture;
    }

    public async findById(id: string): Promise<Lecture | undefined> {
        return MEMORY_DATABASE.lectures.get(id);
    }

    public async set(lecture: Lecture): Promise<void> {
        await this.getById(lecture.id);

        if (!(lecture instanceof MemoryLecture))
            lecture = new MemoryLecture(lecture.id, lecture.time);
        
        MEMORY_DATABASE.lectures.set(lecture.id, lecture);
    }
}