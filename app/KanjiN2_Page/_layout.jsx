import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanji_n2_tier1'),
            buildTab('kanji_n2_tier2'),
            buildTab('kanji_n2_tier3'),
        ]}
    />
)

export default KanjiLayout
