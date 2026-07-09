import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const RadicalsQuiz_Variants = () => {
    const course = COURSES.radicals_variants
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} />
}

export default RadicalsQuiz_Variants
