import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const HiraganaLayout = () => (
    <TopSlider
        tabs={[
            buildTab('hiragana_basic'),
            buildTab('hiragana_variants'),
            buildTab('hiragana_combinations'),
        ]}
    />
)

export default HiraganaLayout
