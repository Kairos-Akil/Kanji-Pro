import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const KanjiQuiz_N3_Tier3 = () => {
    const course = COURSES.kanji_n3_tier3
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} questionModes={course.questionModes} />
}

export default KanjiQuiz_N3_Tier3
