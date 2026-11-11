import { useLocalSearchParams } from 'expo-router'
import Quiz from '../../components/Quiz'
import { COURSES } from '../../constants/Courses'

// One route for every quiz: the URL segment is the course id, e.g. /Quiz_Page/kanji_n5_tier1.
const QuizScreen = () => {
    const { courseId } = useLocalSearchParams()
    const course = COURSES[courseId]
    if (!course) return null // unknown id in the URL; the header's back button still works

    // key: a different course gets a fresh quiz state instead of reusing the previous one's.
    return (
        <Quiz
            key={course.id}
            data={course.data}
            quizId={course.id}
            idKey={course.idKey}
            answerKey={course.answerKey}
            questionModes={course.questionModes}
        />
    )
}

export default QuizScreen
