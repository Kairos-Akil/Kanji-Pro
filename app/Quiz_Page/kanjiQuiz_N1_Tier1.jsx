import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const KanjiQuiz_N1_Tier1 = () => {
    const course = COURSES.kanji_n1_tier1
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} questionModes={course.questionModes} />
}

export default KanjiQuiz_N1_Tier1
