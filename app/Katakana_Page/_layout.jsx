import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KatakanaLayout = () => (
    <TopSlider
        tabs={[
            buildTab('katakanaBasic', 'katakana_basic'),
            buildTab('katakanaVariants', 'katakana_variants'),
            buildTab('katakanaCombinations', 'katakana_combinations'),
        ]}
    />
)

export default KatakanaLayout
