import Lecture from '../models/abstract/lecture.model';
import { API_SCOPE, RESOURCES } from '../constants/general.constants';
import { getPaginatedLinks, getResourceUrl, queryParamsStringBuilder } from '../helpers/url.helper';
import { PaginatedCollection } from '../interfaces/paging.interface';
import { DAY } from '../constants/time.constants';

export const lectureToDto = (lecture: Lecture, scope: API_SCOPE): ILectureDto => {
    const url = getResourceUrl(RESOURCES.LECTURE, scope, lecture.id);
    return {
        id: lecture.id,
        day: lecture.time.dayOfWeek,
        startTime: lecture.time.startTime.toString(),
        endTime: lecture.time.endTime.toString(),
        url
    };
};

export const paginatedLecturesToDto = (paginatedLectures: PaginatedCollection<Lecture>, scope: API_SCOPE): ILectureDto[] => {
    return paginatedLectures.collection.map(l => lectureToDto(l, scope));
};

export const paginatedLecturesToLinks = (paginatedLectures: PaginatedCollection<Lecture>, basePath: string, limit: number, filter?: string, time?: string | string[], buildingId?: string): Record<string, string> => {
    return getPaginatedLinks(paginatedLectures, paginatedLecturesUrlBuilder, basePath, limit, filter, time, buildingId);
};

const paginatedLecturesUrlBuilder = (basePath: string, page: string, limit: string, filter?: string, time?: string | string[], buildingId?: string): string => {
    const params = {
        page,
        limit,
        filter,
        time,
        buildingId
    };
    return queryParamsStringBuilder(basePath, params);
};

interface ILectureDto {
    id: string;
    day: DAY,
    startTime: string,
    endTime: string,
    url: string;
}
