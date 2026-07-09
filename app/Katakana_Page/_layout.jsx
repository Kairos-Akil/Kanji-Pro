import KatakanaBasic from './katakanaBasic'
import KatakanaVariants from './katakanaVariants'
import KatakanaCombinations from './katakanaCombinations'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KatakanaLayout = () => (
    <TopSlider
        tabs={[
            buildTab('katakanaBasic', KatakanaBasic, 'katakana_basic'),
            buildTab('katakanaVariants', KatakanaVariants, 'katakana_variants'),
            buildTab('katakanaCombinations', KatakanaCombinations, 'katakana_combinations'),
        ]}
    />
)

export default KatakanaLayout
