import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const HiraganaQuiz_Variants = () => {
    const course = COURSES.hiragana_variants
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} />
}

export default HiraganaQuiz_Variants
