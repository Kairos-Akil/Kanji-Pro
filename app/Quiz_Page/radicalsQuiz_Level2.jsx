import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const RadicalsQuiz_Level2 = () => {
    const course = COURSES.radicals_level2
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} />
}

export default RadicalsQuiz_Level2
