import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const KanjiQuiz_N5_Tier2 = () => {
    const course = COURSES.kanji_n5_tier2
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} questionModes={course.questionModes} />
}

export default KanjiQuiz_N5_Tier2
