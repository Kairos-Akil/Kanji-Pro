import HiraganaBasic from './hiraganaBasic'
import HiraganaVariants from './hiraganaVariants'
import HiraganaCombinations from './hiraganaCombinations'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const HiraganaLayout = () => (
    <TopSlider
        tabs={[
            buildTab('hiraganaBasic', HiraganaBasic, 'hiragana_basic'),
            buildTab('hiraganaVariants', HiraganaVariants, 'hiragana_variants'),
            buildTab('hiraganaCombinations', HiraganaCombinations, 'hiragana_combinations'),
        ]}
    />
)

export default HiraganaLayout
