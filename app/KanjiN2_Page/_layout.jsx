import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN2Tier1', 'kanji_n2_tier1'),
            buildTab('kanjiN2Tier2', 'kanji_n2_tier2'),
            buildTab('kanjiN2Tier3', 'kanji_n2_tier3'),
        ]}
    />
)

export default KanjiLayout
