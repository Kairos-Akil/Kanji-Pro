import fs from 'fs'
import path from 'path'
import { COURSES, KANJI_QUESTION_MODES } from '../constants/Courses'
import { toAnswerList, answerDisplayText, typedAnswerMatches, hasModeData, pickWrongOptions } from '../utils/answers'
import { kanaToRomaji } from '../utils/kanaToRomaji'

// These run over the whole data set, so a data change (new kanji, re-imported readings) that would
// break the quiz fails here instead of on a user's phone.

const courses = Object.values(COURSES)
const modesOf = (course) => course.questionModes ?? [{ key: course.answerKey }]

describe('course registry', () => {
    test('every preview route points at an existing route file', () => {
        for (const course of courses) {
            const file = path.join(__dirname, '..', 'app', `${course.route}.jsx`)
            expect({ course: course.id, exists: fs.existsSync(file) }).toEqual({ course: course.id, exists: true })
        }
    })

    test('the dynamic quiz route exists (quizzes are /Quiz_Page/<course id>)', () => {
        expect(fs.existsSync(path.join(__dirname, '..', 'app', 'Quiz_Page', '[courseId].jsx'))).toBe(true)
    })

    test('item ids are unique within each course (they are the progress keys)', () => {
        for (const course of courses) {
            const ids = course.data.map(item => item[course.idKey])
            expect({ course: course.id, duplicates: ids.length - new Set(ids).size }).toEqual({ course: course.id, duplicates: 0 })
        }
    })
})

describe('multiple choice', () => {
    test('every question gets 3 distinct wrong options that are really wrong', () => {
        for (const course of courses) {
            for (const mode of modesOf(course)) {
                for (const item of course.data.filter(i => hasModeData(i, mode))) {
                    const correct = toAnswerList(item[mode.key])
                    const wrong = pickWrongOptions(course.data, item, mode)
                    const labels = wrong.map(w => answerDisplayText(w[mode.key]))
                    const sharesAnswer = wrong.some(w => toAnswerList(w[mode.key]).some(a => correct.includes(a)))

                    if (wrong.length !== 3 || new Set(labels).size !== 3 || sharesAnswer) {
                        throw new Error(`${course.id} ${mode.key} ${item[course.idKey]}: got ${JSON.stringify(labels)}`)
                    }
                }
            }
        }
    })
})

describe('keyboard mode', () => {
    // The quiz keyboard has a-z and space only.
    const typeable = (text) => text.toLowerCase().replace(/[^a-z ]/g, '')

    test('every meaning question can be typed', () => {
        for (const course of courses) {
            for (const mode of modesOf(course).filter(m => m.key === 'meanings')) {
                for (const item of course.data.filter(i => hasModeData(i, mode))) {
                    const answers = toAnswerList(item[mode.key])
                    const answerable = answers.some(a => typeable(a).trim() && typedAnswerMatches(typeable(a), answers))
                    if (!answerable) throw new Error(`${course.id} ${item[course.idKey]}: ${JSON.stringify(answers)}`)
                }
            }
        }
    })

    test('every kanji reading converts to romaji, so reading questions can be typed', () => {
        for (const course of courses.filter(c => c.questionModes === KANJI_QUESTION_MODES)) {
            for (const item of course.data) {
                for (const reading of [...(item.onyomi ?? []), ...(item.kunyomi ?? [])]) {
                    if (kanaToRomaji(reading) == null) throw new Error(`${course.id} ${item.character}: ${reading}`)
                }
            }
        }
    })
})
