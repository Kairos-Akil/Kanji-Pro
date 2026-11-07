import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const HiraganaLayout = () => (
    <TopSlider
        tabs={[
            buildTab('hiraganaBasic', 'hiragana_basic'),
            buildTab('hiraganaVariants', 'hiragana_variants'),
            buildTab('hiraganaCombinations', 'hiragana_combinations'),
        ]}
    />
)

export default HiraganaLayout
