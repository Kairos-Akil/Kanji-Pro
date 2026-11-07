import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KatakanaLayout = () => (
    <TopSlider
        tabs={[
            buildTab('katakana_basic'),
            buildTab('katakana_variants'),
            buildTab('katakana_combinations'),
        ]}
    />
)

export default KatakanaLayout
