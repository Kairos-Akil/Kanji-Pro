import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const HiraganaQuiz_Basic = () => {
    const course = COURSES.hiragana_basic
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} />
}

export default HiraganaQuiz_Basic
