import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

const KatakanaQuiz_Combinations = () => {
    const course = COURSES.katakana_combinations
    return <Quiz Data={course.data} quizId={course.id} idKey={course.idKey} answerKey={course.answerKey} />
}

export default KatakanaQuiz_Combinations
