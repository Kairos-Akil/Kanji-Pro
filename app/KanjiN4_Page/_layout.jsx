import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanji_n4_tier1'),
            buildTab('kanji_n4_tier2'),
            buildTab('kanji_n4_tier3'),
        ]}
    />
)

export default KanjiLayout
