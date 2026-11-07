import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const KanjiLayout = () => (
    <TopSlider
        tabs={[
            buildTab('kanjiN1Tier1', 'kanji_n1_tier1'),
            buildTab('kanjiN1Tier2', 'kanji_n1_tier2'),
            buildTab('kanjiN1Tier3', 'kanji_n1_tier3'),
        ]}
    />
)

export default KanjiLayout
